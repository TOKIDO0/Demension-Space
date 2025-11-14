package com.example.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.example.common.Result;
import com.example.entity.Project;
import com.example.service.ProjectService;
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
@RequestMapping("/api/project")
public class ProjectController {
    @Resource
    private ProjectService projectService;
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
    public Result<?> save(@RequestBody Project project) {
        return Result.success(projectService.save(project));
    }

    @PutMapping
    public Result<?> update(@RequestBody Project project) {
        return Result.success(projectService.updateById(project));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        projectService.removeById(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<?> findById(@PathVariable Long id) {
        return Result.success(projectService.getById(id));
    }

    @GetMapping
    public Result<?> findAll() {
        return Result.success(projectService.list());
    }

    @GetMapping("/page")
    public Result<?> findPage(@RequestParam(required = false, defaultValue = "") String name,
                                                @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        LambdaQueryWrapper<Project> query = Wrappers.<Project>lambdaQuery().orderByDesc(Project::getId);
        if (StrUtil.isNotBlank(name)) {
            query.like(Project::getName, name);
        }
        return Result.success(projectService.page(new Page<>(pageNum, pageSize), query));
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {

        List<Map<String, Object>> list = CollUtil.newArrayList();

        List<Project> all = projectService.list();
        for (Project obj : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("面积", obj.getArea());
            row.put("小区id", obj.getCommunityid());
            row.put("项目状态", obj.gettConditions());
            row.put("合同编号", obj.getContractid());
            row.put("完工日期", obj.getDdl());
            row.put("部门所属id", obj.getDepartmentid());
            row.put("项目代码", obj.getId());
            row.put("项目经理id", obj.getManagerid());
            row.put("合同造价", obj.getMoney());
            row.put("客户姓名", obj.getName());
            row.put("客户性别", obj.getSex());

            list.add(row);
        }

        // 2. 写excel
        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        String fileName = URLEncoder.encode("项目档案信息", "UTF-8");
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
        List<Project> saveList = new ArrayList<>();
        for (List<Object> row : lists) {
            Project obj = new Project();
            obj.setArea(Integer.valueOf((String) row.get(1)));
            obj.setCommunityid(Integer.valueOf((String) row.get(2)));
            obj.settConditions(String.valueOf((String) row.get(3)));
            obj.setContractid(Integer.valueOf((String) row.get(4)));
            obj.setDdl((String) row.get(5));
            obj.setDepartmentid(Integer.valueOf((String) row.get(6)));
            obj.setManagerid(Integer.valueOf((String) row.get(7)));
            obj.setMoney(Integer.valueOf((String) row.get(8)));
            obj.setName((String) row.get(9));
            obj.setSex((String) row.get(10));

            saveList.add(obj);
        }
        projectService.saveBatch(saveList);
        return Result.success();
    }

}
