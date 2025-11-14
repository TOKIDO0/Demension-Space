package com.example.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.example.common.Result;
import com.example.entity.Constructionrec;
import com.example.service.ConstructionrecService;
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
@RequestMapping("/api/constructionrec")
public class ConstructionrecController {
    @Resource
    private ConstructionrecService constructionrecService;
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
    public Result<?> save(@RequestBody Constructionrec constructionrec) {
        return Result.success(constructionrecService.save(constructionrec));
    }

    @PutMapping
    public Result<?> update(@RequestBody Constructionrec constructionrec) {
        return Result.success(constructionrecService.updateById(constructionrec));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        constructionrecService.removeById(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<?> findById(@PathVariable Long id) {
        return Result.success(constructionrecService.getById(id));
    }

    @GetMapping
    public Result<?> findAll() {
        return Result.success(constructionrecService.list());
    }

    @GetMapping("/page")
    public Result<?> findPage(@RequestParam(required = false, defaultValue = "") String name,
                                                @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        LambdaQueryWrapper<Constructionrec> query = Wrappers.<Constructionrec>lambdaQuery().orderByDesc(Constructionrec::getId);
        if (StrUtil.isNotBlank(name)) {
            query.like(Constructionrec::getName, name);
        }
        return Result.success(constructionrecService.page(new Page<>(pageNum, pageSize), query));
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {

        List<Map<String, Object>> list = CollUtil.newArrayList();

        List<Constructionrec> all = constructionrecService.list();
        for (Constructionrec obj : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("施工代码", obj.getConstructionid());
            row.put("施工日期", obj.getDate());
            row.put("施工记录号", obj.getId());
            row.put("使用施工款", obj.getMoney());
            row.put("项目实施名称", obj.getName());
            row.put("项目代码", obj.getProjectid());
            row.put("员工id", obj.getStaffid());

            list.add(row);
        }

        // 2. 写excel
        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        String fileName = URLEncoder.encode("施工记录信息", "UTF-8");
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
        List<Constructionrec> saveList = new ArrayList<>();
        for (List<Object> row : lists) {
            Constructionrec obj = new Constructionrec();
            obj.setConstructionid(Integer.valueOf((String) row.get(1)));
            obj.setDate((String) row.get(2));
            obj.setMoney(Integer.valueOf((String) row.get(3)));
            obj.setName((String) row.get(4));
            obj.setProjectid(Integer.valueOf((String) row.get(5)));
            obj.setStaffid(Integer.valueOf((String) row.get(6)));

            saveList.add(obj);
        }
        constructionrecService.saveBatch(saveList);
        return Result.success();
    }

}
