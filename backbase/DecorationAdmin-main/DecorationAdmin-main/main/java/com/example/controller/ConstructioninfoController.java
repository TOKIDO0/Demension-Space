package com.example.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.example.common.Result;
import com.example.entity.Constructioninfo;
import com.example.service.ConstructioninfoService;
import com.example.entity.User;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.web.bind.annotation.*;
import com.example.exception.CustomException;
import cn.hutool.core.util.StrUtil;

import javax.annotation.Resource;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/constructioninfo")
public class ConstructioninfoController {
    @Resource
    private ConstructioninfoService constructioninfoService;
    @Resource
    private HttpServletRequest request;

    public User getUser() {
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            throw new CustomException("-1", "请登录");
        }
        return user;
    }

    @PostMapping
    public Result<?> save(@RequestBody Constructioninfo constructioninfo) {
        return Result.success(constructioninfoService.save(constructioninfo));
    }

    @PutMapping
    public Result<?> update(@RequestBody Constructioninfo constructioninfo) {
        return Result.success(constructioninfoService.updateById(constructioninfo));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        constructioninfoService.removeById(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<?> findById(@PathVariable Long id) {
        return Result.success(constructioninfoService.getById(id));
    }

    @GetMapping
    public Result<?> findAll() {
        return Result.success(constructioninfoService.list());
    }

    @GetMapping("/page")
    public Result<?> findPage(@RequestParam(required = false, defaultValue = "") String name,
                                                @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        LambdaQueryWrapper<Constructioninfo> query = Wrappers.<Constructioninfo>lambdaQuery().orderByDesc(Constructioninfo::getId);
        if (StrUtil.isNotBlank(name)) {
            query.like(Constructioninfo::getName, name);
        }
        return Result.success(constructioninfoService.page(new Page<>(pageNum, pageSize), query));
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {

        List<Map<String, Object>> list = CollUtil.newArrayList();

        List<Constructioninfo> all = constructioninfoService.list();
        for (Constructioninfo obj : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("施工凭证号", obj.getCertid());
            row.put("施工代码号", obj.getId());
            row.put("备用", obj.getName());

            list.add(row);
        }

        // 2. 写excel
        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        String fileName = URLEncoder.encode("施工代码信息", "UTF-8");
        response.setHeader("Content-Disposition", "attachment;filename=" + fileName + ".xlsx");

        ServletOutputStream out = response.getOutputStream();
        writer.flush(out, true);
        writer.close();
        IoUtil.close(System.out);
    }

    @GetMapping("/upload/{fileId}")
    public Result<?> upload(@PathVariable String fileId) {
        String basePath = System.getProperty("user.dir") + "/src/main/resources/static/file/";
        List<String> fileNames = FileUtil.listFileNames(basePath);
        String file = fileNames.stream().filter(name -> name.contains(fileId)).findAny().orElse("");
        List<List<Object>> lists = ExcelUtil.getReader(basePath + file).read(1);
        List<Constructioninfo> saveList = new ArrayList<>();
        for (List<Object> row : lists) {
            Constructioninfo obj = new Constructioninfo();
            obj.setCertid(Integer.valueOf((String) row.get(1)));
            obj.setName((String) row.get(2));

            saveList.add(obj);
        }
        constructioninfoService.saveBatch(saveList);
        return Result.success();
    }

}
